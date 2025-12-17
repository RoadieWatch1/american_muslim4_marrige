// src/pages/IntroRequests.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, User } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

type IntroStatus = 'pending' | 'approved' | 'rejected';

type IntroRowFromRpc = {
  id: string;
  direction: 'sent' | 'received';
  status: IntroStatus;
  message: string | null;
  created_at: string;
  wali_id: string | null;
  wali_approved: boolean | null; // from RPC
  other_user_id: string;
  other_first_name: string | null;
  other_last_name: string | null;
  other_city: string | null;
  other_state: string | null;
  other_dob: string | null;
  other_gender: string | null;
};

type IntroWithProfile = {
  id: string;
  direction: 'sent' | 'received';
  status: IntroStatus;
  message: string | null;
  created_at: string;
  wali_id: string | null;
  waliApproved: boolean | null;
  otherProfile: {
    name: string;
    cityState: string;
    ageLabel: string;
    gender: string | null;
  } | null;
};

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function IntroRequests() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<IntroWithProfile[]>([]);
  const [received, setReceived] = useState<IntroWithProfile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/');
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.rpc(
        'get_intro_requests_for_user',
        {
          p_user_id: user.id,
        },
      );

      if (error) {
        console.error('Error loading intro requests via RPC:', error);
        setErrorMessage('Could not load intro requests. Please try again.');
        setSent([]);
        setReceived([]);
        return;
      }

      const rows = (data || []) as IntroRowFromRpc[];

      const mapped: IntroWithProfile[] = rows.map((row) => {
        const age = calculateAge(row.other_dob);
        const name =
          ((row.other_first_name || '') +
            (row.other_last_name ? ` ${row.other_last_name}` : '')) ||
          'Unknown';

        const cityState = [row.other_city, row.other_state]
          .filter(Boolean)
          .join(', ');

        return {
          id: row.id,
          direction: row.direction,
          status: row.status,
          message: row.message,
          created_at: row.created_at,
          wali_id: row.wali_id,
          waliApproved: row.wali_approved,
          otherProfile: {
            name,
            cityState: cityState || '—',
            ageLabel: age != null ? `${age} yrs` : 'Age N/A',
            gender: row.other_gender,
          },
        };
      });

      setSent(mapped.filter((r) => r.direction === 'sent'));
      setReceived(mapped.filter((r) => r.direction === 'received'));
    } catch (err) {
      console.error('IntroRequests load error:', err);
      setErrorMessage('Something went wrong while loading intro requests.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Accept / Reject handlers
  // ─────────────────────────────
  const handleUpdateStatus = async (id: string, nextStatus: IntroStatus) => {
    if (!user) return;

    try {
      setUpdatingId(id);

      const { error } = await supabase
        .from('intro_requests')
        .update({
          status: nextStatus,
          // if wali is approving, we also mark wali_approved = true
          wali_approved: nextStatus === 'approved' ? true : false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating intro_request status:', error);
        toast.error('Could not update this introduction. Please try again.');
        return;
      }

      await loadData();

      if (nextStatus === 'approved') {
        toast.success('You accepted this introduction.');
      } else if (nextStatus === 'rejected') {
        toast('You rejected this introduction.');
      }
    } catch (err) {
      console.error('IntroRequests status update error:', err);
      toast.error('Something went wrong while updating the request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: IntroStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
          >
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard
      .writeText(id)
      .then(() => toast.success('Intro request ID copied to clipboard.'))
      .catch(() => toast.error('Could not copy ID.'));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your introduction requests...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Introduction Requests
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track introductions you’ve sent and received.
            </p>
          </div>

          <div className="w-10" />
        </div>

        {errorMessage && (
          <p className="text-center text-sm text-red-600 bg-red-50 border border-red-100 rounded-md py-2">
            {errorMessage}
          </p>
        )}

        {/* Sent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Requests You Sent
            </CardTitle>
            <CardDescription>
              These are introductions you initiated to other members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                You haven’t sent any introduction requests yet.
              </p>
            ) : (
              <div className="space-y-4">
                {sent.map((req) => (
                  <div
                    key={req.id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold">
                        To:{' '}
                        {req.otherProfile
                          ? req.otherProfile.name
                          : 'Unknown member'}
                      </p>
                      {req.otherProfile && (
                        <p className="text-sm text-gray-600">
                          {req.otherProfile.ageLabel} • {req.otherProfile.cityState}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Sent on {formatDate(req.created_at)}
                      </p>
                      {req.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          “{req.message}”
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => copyId(req.id)}
                        className="mt-1 text-[11px] text-gray-400 hover:text-gray-600"
                      >
                        Copy request ID
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(req.status)}
                      {req.wali_id && (
                        <span className="text-[11px] text-gray-500 text-right">
                          {req.waliApproved === false
                            ? 'Waiting for wali approval before they can respond.'
                            : 'Wali involved in this introduction.'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Received Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Requests You Received
            </CardTitle>
            <CardDescription>
              These are introductions that other members started with you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                You haven’t received any introduction requests yet.
              </p>
            ) : (
              <div className="space-y-4">
                {received.map((req) => {
                  const isCurrentUserWali = req.wali_id === user.id;

                  console.log('req',req)

                  // Female recipient with wali: show waiting message + hide buttons
                  const waitingForWali =
                    !!req.wali_id &&
                    req.status === 'pending' &&
                    req.waliApproved === false &&
                    !isCurrentUserWali;

                  return (
                    <div
                      key={req.id}
                      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold">
                          From:{' '}
                          {req.otherProfile
                            ? req.otherProfile.name
                            : 'Unknown member'}
                        </p>
                        {req.otherProfile && (
                          <p className="text-sm text-gray-600">
                            {req.otherProfile.ageLabel} •{' '}
                            {req.otherProfile.cityState}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Received on {formatDate(req.created_at)}
                        </p>
                        {req.message && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            “{req.message}”
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => copyId(req.id)}
                          className="mt-1 text-[11px] text-gray-400 hover:text-gray-600"
                        >
                          Copy request ID
                        </button>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(req.status)}

                        {waitingForWali && (
                          <span className="text-[11px] text-amber-600 text-right">
                            Waiting for wali approval. You’ll be able to respond
                            once your wali approves this introduction.
                          </span>
                        )}

                        {isCurrentUserWali &&
                          req.status === 'pending' &&
                          req.waliApproved === false && (
                            <span className="text-[11px] text-gray-600 text-right">
                              You are the wali for this sister. Please approve
                              or reject this introduction.
                            </span>
                          )}

                        {/* Accept / Reject logic:
                           - If NO wali: recipient can act (same as before).
                           - If a wali EXISTS: only the wali sees these buttons.
                        */}
                        {req.status === 'pending' &&
                          (!req.wali_id || isCurrentUserWali) &&
                          !waitingForWali && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                disabled={updatingId === req.id}
                                onClick={() =>
                                  handleUpdateStatus(req.id, 'approved')
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === req.id}
                                onClick={() =>
                                  handleUpdateStatus(req.id, 'rejected')
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                        {req.wali_id && !waitingForWali && !isCurrentUserWali && (
                          <span className="text-[11px] text-gray-500 text-right">
                            Wali is attached to this introduction.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




// // src/pages/IntroRequests.tsx
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Clock, CheckCircle2, XCircle, User } from 'lucide-react';

// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/contexts/AuthContext';

// import { Button } from '@/components/ui/Button';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from '@/components/ui/card';
// import { Badge } from '@/components/ui/Badge';
// import { toast } from 'sonner';

// type IntroStatus = 'pending' | 'approved' | 'rejected';

// type IntroRowFromRpc = {
//   id: string;
//   direction: 'sent' | 'received';
//   status: IntroStatus;
//   message: string | null;
//   created_at: string;
//   wali_id: string | null;
//   wali_approved: boolean | null; // 👈 from RPC
//   other_user_id: string;
//   other_first_name: string | null;
//   other_last_name: string | null;
//   other_city: string | null;
//   other_state: string | null;
//   other_dob: string | null;
//   other_gender: string | null;
// };

// type IntroWithProfile = {
//   id: string;
//   direction: 'sent' | 'received';
//   status: IntroStatus;
//   message: string | null;
//   created_at: string;
//   wali_id: string | null;
//   waliApproved: boolean | null; // 👈 mapped field
//   otherProfile: {
//     name: string;
//     cityState: string;
//     ageLabel: string;
//     gender: string | null;
//   } | null;
// };

// function calculateAge(dob: string | null): number | null {
//   if (!dob) return null;
//   const birth = new Date(dob);
//   if (Number.isNaN(birth.getTime())) return null;

//   const today = new Date();
//   let age = today.getFullYear() - birth.getFullYear();
//   const m = today.getMonth() - birth.getMonth();
//   if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
//     age--;
//   }
//   return age;
// }

// function formatDate(d: string) {
//   try {
//     return new Date(d).toLocaleString();
//   } catch {
//     return d;
//   }
// }

// export default function IntroRequests() {
//   const navigate = useNavigate();
//   const { user, loading: authLoading } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [sent, setSent] = useState<IntroWithProfile[]>([]);
//   const [received, setReceived] = useState<IntroWithProfile[]>([]);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [updatingId, setUpdatingId] = useState<string | null>(null);

//   useEffect(() => {
//     if (authLoading) return;

//     if (!user) {
//       navigate('/');
//       return;
//     }

//     void loadData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, authLoading]);

//   const loadData = async () => {
//     if (!user) return;

//     setLoading(true);
//     setErrorMessage(null);

//     try {
//       const { data, error } = await supabase.rpc(
//         'get_intro_requests_for_user',
//         {
//           p_user_id: user.id,
//         },
//       );

//       if (error) {
//         console.error('Error loading intro requests via RPC:', error);
//         setErrorMessage('Could not load intro requests. Please try again.');
//         setSent([]);
//         setReceived([]);
//         return;
//       }

//       const rows = (data || []) as IntroRowFromRpc[];

//       const mapped: IntroWithProfile[] = rows.map((row) => {
//         const age = calculateAge(row.other_dob);
//         const name =
//           ((row.other_first_name || '') +
//             (row.other_last_name ? ` ${row.other_last_name}` : '')) ||
//           'Unknown';

//         const cityState = [row.other_city, row.other_state]
//           .filter(Boolean)
//           .join(', ');

//         return {
//           id: row.id,
//           direction: row.direction,
//           status: row.status,
//           message: row.message,
//           created_at: row.created_at,
//           wali_id: row.wali_id,
//           waliApproved: row.wali_approved,
//           otherProfile: {
//             name,
//             cityState: cityState || '—',
//             ageLabel: age != null ? `${age} yrs` : 'Age N/A',
//             gender: row.other_gender,
//           },
//         };
//       });

//       setSent(mapped.filter((r) => r.direction === 'sent'));
//       setReceived(mapped.filter((r) => r.direction === 'received'));
//     } catch (err) {
//       console.error('IntroRequests load error:', err);
//       setErrorMessage('Something went wrong while loading intro requests.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─────────────────────────────
//   // Accept / Reject handlers
//   // ─────────────────────────────
//   const handleUpdateStatus = async (id: string, nextStatus: IntroStatus) => {
//     if (!user) return;

//     try {
//       setUpdatingId(id);

//       const { error } = await supabase
//         .from('intro_requests')
//         .update({
//           status: nextStatus,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', id);

//       if (error) {
//         console.error('Error updating intro_request status:', error);
//         toast.error('Could not update this introduction. Please try again.');
//         return;
//       }

//       await loadData();

//       if (nextStatus === 'approved') {
//         toast.success('You accepted this introduction.');
//       } else if (nextStatus === 'rejected') {
//         toast('You rejected this introduction.');
//       }
//     } catch (err) {
//       console.error('IntroRequests status update error:', err);
//       toast.error('Something went wrong while updating the request.');
//     } finally {
//       setUpdatingId(null);
//     }
//   };

//   const statusBadge = (status: IntroStatus) => {
//     switch (status) {
//       case 'pending':
//         return (
//           <Badge variant="secondary" className="flex items-center gap-1">
//             <Clock className="h-3 w-3" />
//             Pending
//           </Badge>
//         );
//       case 'approved':
//         return (
//           <Badge className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
//             <CheckCircle2 className="h-3 w-3" />
//             Approved
//           </Badge>
//         );
//       case 'rejected':
//         return (
//           <Badge
//             variant="destructive"
//             className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
//           >
//             <XCircle className="h-3 w-3" />
//             Rejected
//           </Badge>
//         );
//       default:
//         return null;
//     }
//   };

//   const copyId = (id: string) => {
//     navigator.clipboard
//       .writeText(id)
//       .then(() => toast.success('Intro request ID copied to clipboard.'))
//       .catch(() => toast.error('Could not copy ID.'));
//   };

//   if (authLoading || loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
//           <p className="text-gray-600">Loading your introduction requests...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
//       <div className="max-w-5xl mx-auto space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
//             <ArrowLeft className="h-5 w-5" />
//           </Button>

//           <div className="text-center flex-1">
//             <h1 className="text-2xl font-bold text-gray-900">
//               Introduction Requests
//             </h1>
//             <p className="text-sm text-gray-600 mt-1">
//               Track introductions you’ve sent and received.
//             </p>
//           </div>

//           <div className="w-10" />
//         </div>

//         {errorMessage && (
//           <p className="text-center text-sm text-red-600 bg-red-50 border border-red-100 rounded-md py-2">
//             {errorMessage}
//           </p>
//         )}

//         {/* Sent Requests */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <User className="h-5 w-5 text-emerald-600" />
//               Requests You Sent
//             </CardTitle>
//             <CardDescription>
//               These are introductions you initiated to other members.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {sent.length === 0 ? (
//               <p className="text-sm text-gray-500 text-center py-6">
//                 You haven’t sent any introduction requests yet.
//               </p>
//             ) : (
//               <div className="space-y-4">
//                 {sent.map((req) => (
//                   <div
//                     key={req.id}
//                     className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
//                   >
//                     <div>
//                       <p className="font-semibold">
//                         To:{' '}
//                         {req.otherProfile
//                           ? req.otherProfile.name
//                           : 'Unknown member'}
//                       </p>
//                       {req.otherProfile && (
//                         <p className="text-sm text-gray-600">
//                           {req.otherProfile.ageLabel} • {req.otherProfile.cityState}
//                         </p>
//                       )}
//                       <p className="text-xs text-gray-500 mt-1">
//                         Sent on {formatDate(req.created_at)}
//                       </p>
//                       {req.message && (
//                         <p className="text-sm text-gray-700 mt-2 italic">
//                           “{req.message}”
//                         </p>
//                       )}
//                       <button
//                         type="button"
//                         onClick={() => copyId(req.id)}
//                         className="mt-1 text-[11px] text-gray-400 hover:text-gray-600"
//                       >
//                         Copy request ID
//                       </button>
//                     </div>
//                     <div className="flex flex-col items-end gap-2">
//                       {statusBadge(req.status)}
//                       {req.wali_id && (
//                         <span className="text-[11px] text-gray-500 text-right">
//                           {req.waliApproved === false
//                             ? 'Waiting for wali approval before they can respond.'
//                             : 'Wali involved in this introduction.'}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Received Requests */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <User className="h-5 w-5 text-indigo-600" />
//               Requests You Received
//             </CardTitle>
//             <CardDescription>
//               These are introductions that other members started with you.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {received.length === 0 ? (
//               <p className="text-sm text-gray-500 text-center py-6">
//                 You haven’t received any introduction requests yet.
//               </p>
//             ) : (
//               <div className="space-y-4">
//                 {received.map((req) => {
//                   const waitingForWali =
//                     !!req.wali_id &&
//                     req.status === 'pending' &&
//                     req.waliApproved === false;

//                   return (
//                     <div
//                       key={req.id}
//                       className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
//                     >
//                       <div>
//                         <p className="font-semibold">
//                           From:{' '}
//                           {req.otherProfile
//                             ? req.otherProfile.name
//                             : 'Unknown member'}
//                         </p>
//                         {req.otherProfile && (
//                           <p className="text-sm text-gray-600">
//                             {req.otherProfile.ageLabel} •{' '}
//                             {req.otherProfile.cityState}
//                           </p>
//                         )}
//                         <p className="text-xs text-gray-500 mt-1">
//                           Received on {formatDate(req.created_at)}
//                         </p>
//                         {req.message && (
//                           <p className="text-sm text-gray-700 mt-2 italic">
//                             “{req.message}”
//                           </p>
//                         )}
//                         <button
//                           type="button"
//                           onClick={() => copyId(req.id)}
//                           className="mt-1 text-[11px] text-gray-400 hover:text-gray-600"
//                         >
//                           Copy request ID
//                         </button>
//                       </div>

//                       <div className="flex flex-col items-end gap-2">
//                         {statusBadge(req.status)}

//                         {waitingForWali && (
//                           <span className="text-[11px] text-amber-600 text-right">
//                             Waiting for wali approval. You’ll be able to respond
//                             once your wali approves this introduction.
//                           </span>
//                         )}

//                         {/* Only show Accept / Reject while pending AND wali already approved (or no wali) */}
//                         {req.status === 'pending' && !waitingForWali && (
//                           <div className="flex gap-2 mt-2">
//                             <Button
//                               size="sm"
//                               disabled={updatingId === req.id}
//                               onClick={() =>
//                                 handleUpdateStatus(req.id, 'approved')
//                               }
//                             >
//                               Accept
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               disabled={updatingId === req.id}
//                               onClick={() =>
//                                 handleUpdateStatus(req.id, 'rejected')
//                               }
//                             >
//                               Reject
//                             </Button>
//                           </div>
//                         )}

//                         {req.wali_id && !waitingForWali && (
//                           <span className="text-[11px] text-gray-500">
//                             Wali is attached to this introduction
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
